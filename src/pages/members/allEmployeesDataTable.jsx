import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import DataTable from "@/components/DataTable";
import FinderPINFL from "@/components/FinderPINFL";
import FormInput from "@/components/FormInput";
import dayjs from "dayjs";
import styles from "./members.module.scss";
import { useSnackbar } from "notistack";
import { Button } from "@mui/material";
import { getFIO, splitEmployement, splitFIO } from "@/utils/data";
import { useSelector } from "react-redux";
import { deleteMember, sendMember } from "@/http/data";
import CheckBoxGroup from "@/components/CheckBoxGroup";
import useActions from "@/hooks/useActions";
import { showYesNoDialog } from "@/utils/dialog";
import { LoadingButton } from "@mui/lab";
import VisibilityIcon from "@mui/icons-material/Visibility";
import useDynamicData from "@/hooks/useDynamicData";
import RadioGroup from "@/components/RadioGroup";

export default function AllEmployeesDT() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [ticketCreated, setTickedCreated] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const { bkutData = {} } = useSelector((states) => states);
  const bkutDataRef = useRef(bkutData);
  const { enqueueSnackbar } = useSnackbar();
  const actions = useActions();

  const columns = [
    { field: "fio", headerName: "employees.fio", size: 280 },
    { field: "signDate", headerName: "employees.dateSign" },
    {
      field: "employment",
      type: "chip",
      headerName: "employment",
      default: [
        t("isHomemaker"),
        t("isInvalid"),
        t("isPensioner"),
        t("isStudent"),
      ].join(", "),
    },
    { field: "pinfl", headerName: "pinfl", hidden: true },
    { field: "position", headerName: "job-position", hidden: true },
    { field: "birthDate", headerName: "birth-date", hidden: true },
    { field: "phoneNumber", headerName: "phone-number", hidden: true },
    {
      field: "email",
      headerName: "email",
      hidden: true,
    },
  ];

  function getEmployeement(member) {
    let result = [];
    if (member.isHomemaker) result.push(t("isHomemaker"));
    if (member.isInvalid) result.push(t("isInvalid"));
    if (member.isPensioner) result.push(t("isPensioner"));
    if (member.isStudent) result.push(t("isStudent"));

    return result;
  }

  useEffect(() => {
    bkutDataRef.current = bkutData;
    if (!bkutData?.members?.length) return;
    setRows(
      bkutData?.members.map((e) => {
        return {
          id: e.id,
          fio: getFIO(e.member),
          signDate: e.joinDate,
          employment: getEmployeement(e),
          birthDate: e.member?.birthDate ?? "",
          position: e.position,
          phone: e.phone,
          email: e.email,
          pinfl: e.member?.pinfl,
        };
      })
    );
  }, [bkutData]);

  async function onSubmitModal(forms, hideModal, isView) {
    if (
      !isView &&
      (bkutData?.members ?? []).find((e) => e.member.pinfl == forms.pinfl)
    ) {
      showYesNoDialog(
        t("rewrite-pinfl-member"),
        () => sendData(forms, hideModal, true),
        () => {},
        t
      );
      return;
    }
    sendData(forms, hideModal, isView);
  }

  async function sendData(forms, hideModal, isView, noAlert = false) {
    const bkutData = bkutDataRef.current;
    const members = (bkutData.members ?? [])
      .filter((e) => (isView ? e.member.pinfl != forms.pinfl : true))
      .map((e) => ({
        ...e,
        bkut: {
          id: bkutData.id,
        },
        member: {
          id: e.member.id,
        },
        joinDate: e.joinDate,
        position: e.position,
        phone: e.phoneNumber,
        email: e.email,
      }));
    const requestData = {
      id: bkutData.id,
      members: [
        {
          ...forms.personInfo,
          bkut: {
            id: bkutData.id,
          },
          member: {
            id: "?",
          },
          isMember: forms.isMember,
          joinDate: forms.signDate,
          position: forms.position,
          phone: forms.phoneNumber,
          email: forms.email,
        },
      ],
    };
    const fio = splitFIO(forms.fio);
    const data = {
      bkutId: requestData.id,
      pinfl: forms.pinfl,
      firstName: fio[0],
      lastName: fio[1],
      middleName: fio[2],
      birthDate: forms.birthDate,
    };
    const response = await sendMember(requestData, data, members);
    if (response?.success) {
      const newId = rows[Math.max(rows.length - 1, 0)]?.id ?? 0;
      setRows((rows) => [
        ...rows.filter((r) => r.id != newId),
        { id: newId, ...forms },
      ]);
      if (!noAlert) {
        enqueueSnackbar(t("successfully-saved"), { variant: "success" });
      } else {
        return true;
      }
      actions.updateData();
    } else {
      enqueueSnackbar(t("error-send-bkut"), { variant: "error" });
    }
    if (noAlert) return false;
    if (hideModal) hideModal();
  }

  async function generateDoc() {
    setTicketLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTicketLoading(false);
    setTickedCreated(true);
  }
  async function fetchData(id) {
    const data = (bkutData.members ?? []).find((member) => member.id == id);
    return data;
  }
  async function deleteRow(id) {
    const res = await deleteMember(id);
    if (res) {
      setRows((rows) => rows.filter((row) => row?.id != id));
      actions.updateData();
    } else enqueueSnackbar(t("delete-error"), { variant: "error" });
  }
  async function onImportRow(rowData) {
    const forms = {
      ...rowData,
      personInfo: splitEmployement(rowData.employment),
    };
    return await sendData(forms, null, false, true);
  }

  return (
    <DataTable
      fetchData={fetchData}
      handleDeleteClick={deleteRow}
      columns={columns}
      rows={rows}
      bkutData={bkutData}
      onImportRow={onImportRow}
      onSubmitModal={onSubmitModal}
      isFormModal
      title={t("allEmployeesTitle")}
      loading={ticketLoading}
      modalWidth="80vw"
      bottomModal={(handleSubmit, handleClose, isView) => {
        return (
          <div className={styles.bottom} style={{ position: "relative" }}>
            <div className={styles.row}>
              <Button onClick={handleSubmit} variant="contained">
                {t("save")}
              </Button>
              <Button onClick={handleClose}>{t("close")}</Button>
            </div>
            <LoadingButton
              style={ticketCreated ? { marginRight: 100 } : {}}
              onClick={generateDoc}
              loading={ticketLoading}
              variant="contained"
              color="success"
            >
              {ticketCreated && <VisibilityIcon style={{ marginRight: 5 }} />}
              {ticketCreated ? t("showTicket") : t("createDoc")}
            </LoadingButton>
            {ticketCreated && (
              <img
                style={{ position: "absolute", bottom: -10, right: 0 }}
                height={90}
                src="https://www.qrstuff.com/images/default_qrcode.png"
              />
            )}
          </div>
        );
      }}
      modal={(hideModal, dataModal) => (
        <ModalUI data={dataModal} hideModal={hideModal} />
      )}
    />
  );
}

function ModalUI({ hideModal, data = {} }) {
  const { t } = useTranslation();
  const [isMember, setIsMember] = useState(0);
  const [formData, setFormData] = useState({
    fio: "",
    birthDate: "",
  });
  const [positions] = useDynamicData({ positions: true });
  const {
    id,
    position,
    phone,
    email,
    member = {},
    joinDate,
    _entityName,
    _instanceName,
    ...inData
  } = data;

  useEffect(() => {
    const FIO = getFIO(data.member);
    if (!FIO) return;
    setFormData({
      fio: FIO,
      birthDate: member.birthDate ? dayjs(member.birthDate) : "",
    });
  }, [data]);

  function onFetchPINFL(data) {
    if (!data) return;

    setFormData({
      fio: getFIO(data),
      birthDate: dayjs(data.birth_date),
    });
  }
  return (
    <div className="modal-content">
      <RadioGroup
        left
        defaultValue={1}
        name="isMember"
        contained
        onChange={(e) => {
          setIsMember(e.target.value);
        }}
        data={[
          {
            value: "1",
            label: t("memberYes"),
          },
          {
            value: "0",
            label: t("memberNo"),
          },
        ]}
      />
      <div className="modal-row">
        <FinderPINFL
          disablePINFL
          pinflValue={member.pinfl}
          onFetch={onFetchPINFL}
        />
      </div>
      <div className="modal-row">
        <FormInput
          disabled
          required
          label={t("fio")}
          name="fio"
          value={formData.fio}
        />
        <FormInput
          select
          required
          value="1"
          disabled
          name="gender"
          dataSelect={[
            { value: 1, label: t("man") },
            { value: 0, label: t("woman") },
          ]}
          label={t("gender")}
        />
      </div>
      <div className="modal-row">
        <FormInput
          date
          disabled
          label={t("birth-date")}
          required
          name="birthDate"
          value={formData.birthDate}
        />
        <FormInput
          value={position}
          name="position"
          autocomplete
          options={positions}
          label={t("employees.position")}
        />
        <FormInput
          date
          label={t("employees.dateSign")}
          value={joinDate ? dayjs(joinDate) : null}
          required
          name="signDate"
          // value={formData.signDate}
        />
      </div>
      <div className="modal-row">
        <FormInput value={phone} label={t("phone-number")} name="phoneNumber" />
        <FormInput value={email} label={t("employees.email")} name="email" />
      </div>
      <CheckBoxGroup
        name="personInfo"
        value={inData}
        data={[
          {
            value: "isStudent",
            label: t("isStudent"),
          },
          {
            value: "isHomemaker",
            label: t("isHomemaker"),
          },
          {
            value: "isInvalid",
            label: t("isInvalid"),
          },
        ]}
      />
    </div>
  );
}