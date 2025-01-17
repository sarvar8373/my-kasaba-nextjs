import React, { useEffect, useState } from "react";
import HomeWrapper from "../home/wrapper";
import DocumentViewer from "@/components/DocumentViewer";
import { useSelector } from "react-redux";
import ChangableInput from "@/components/ChangableInput";
import styles from "./1ti.module.scss";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getPresidentBKUT } from "@/utils/data";
import { getReportDate, getReportYear, getYearFrom } from "@/utils/date";
import { getReport1ti } from "@/http/reports";

export default function OneTI() {
  const { bkutData = {} } = useSelector((states) => states);
  const [currentReport, setCurrentReport] = useState({});
  const [years, setYears] = useState([]);
  const [currentYear, setYear] = useState(getReportYear());
  const [data, setData] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    if (!bkutData.id) return;
    const allYears = [];
    const y = getReportYear();
    (bkutData.reports || []).forEach((r) => {
      const cYear = getYearFrom(r.date);
      if (cYear == y) return;
      allYears.push({
        value: cYear,
        label: t("for-year", { year: cYear }),
        labelRu: t("for-year", { year: cYear }),
      });
    });
    allYears.push({ value: y, label: t("for-year", { year: y }) });
    setYears(allYears.reverse());
  }, [bkutData]);

  useEffect(() => {
    if (!bkutData.id) return;
    const temp = (bkutData.reports || []).find((r) => {
      const cYear = getYearFrom(r.date);
      return cYear == currentYear;
    });
    if (typeof temp === "object")
      temp.date = temp?.date || dayjs().format("YYYY-MM-DD");

    setCurrentReport(temp || { date: dayjs().format("YYYY-MM-DD") });
  }, [currentYear, bkutData]);

  useEffect(() => {
    async function initData() {
      if (!currentReport.date) return;

      let data = await getReport1ti(bkutData.id, currentReport.date);
      if (!data.data) return;
      data = typeof data.data === "string" ? JSON.parse(data.data) : data.data;

      const tempJsonData = {
        CURRENTYEARS: data.currentYear,
        BKUTNAME: data.name,
        BKUTDIRECTOR: data.president,
        PHONE: data.phone,
        ISFIRED: data.raisOzod,
        ISAPPARATUS: data.haqApparati,
        WORKERSAMOUNT: data.leEmpAll,
        WORKERSFEMALE: data.leEmpFemale,
        WORKERSADULTS: data.leEmpAge30,
        WORKERSMEMBERS: data.memberEmpAll,
        WORKERSFEMALEMEMBERS: data.memberEmpFemale,
        WORKERSADULTSMEMBERS: data.memberEmpAge30,
        STUDENTSAMOUNT: data.studentAll,
        STUDENTSFEMALE: data.studentFemale,
        STUDENTSADULTS: data.studentAge30,
        STUDENTSMEMBERS: data.memberStudentAll,
        STUDENTSFEMALEMEMBERS: data.memberStudentFemale,
        STUDENTSADULTSMEMBERS: data.memberStudentAge30,
        PENSIONERAMOUNT: data.memberPensioner,
        STAFFINGAMOUNT: data.kuShtat,
        STAFFINGWORKERSAMOUNT: data.kuEmp,
        STAFFINGRESPONSIBLEWORKERS: data.kuMasul,
        STAFFINGTECHNICALWORKERS: data.kuTechnik,
      };

      setData(tempJsonData);
    }
    initData();
  }, [currentReport]);

  return (
    <div className={styles.form}>
      <div className={styles.container}>
        <div className={styles.editBtn}>
          <ChangableInput
            style={{ width: 200 }}
            hideEmpty
            value={currentYear}
            select
            dataSelect={years}
            onChange={({ target: { value } }) => setYear(value)}
          />
          <p
            className={[
              styles.titleYear,
              currentReport?.workersAmount ? "" : styles.red,
            ].join(" ")}
          >
            {currentReport?.workersAmount
              ? t("report-entered")
              : t("report-not-entered")}
          </p>
        </div>

        <DocumentViewer
          documentSrc="/report1ti.docx"
          generateData={data}
          fileName={bkutData.name + " 1ti hisoboti"}
        />
      </div>
    </div>
  );
}

OneTI.layout = function (Component, t) {
  return <HomeWrapper title={t("1ti1")}>{Component}</HomeWrapper>;
};
